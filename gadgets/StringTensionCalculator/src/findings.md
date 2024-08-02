# **D'Addario String Data Analysis**

# Introduction

When I started delving into lutherie for unusual lute-type instruments, I ran into a major issue: "How do I even get strings for this?" For example, my custom-built octave mandolin has a low-C. I wondered about things like:

- Is it OK to take it from a mandocello set and use it?
- How much tension is going through it?
- Will the neck sustain the tension?
- Should I try to find a 070? 072? 074?
- Phosphor bronze or Nickel-plated steel?

This article will hopefully explain some of that for others with the same issue.

# String Tension Physics

I was fortunately able to find some key information and solid empirical data from [this pdf][1] that D'Addario had on their website.

## String Tension Formulas

String Tension is the force that acts along the central axis of the string. In practical terms, the more tension that is applied, the higher the pitch and the harder it will be to deflect. According to the brochure, there are three factors contributing to string tension:

1. Unit Weight - How much the string weighs per unit length
1. Scale Length - The vibrating length of the string, from a nut/zero-fret to the bridge.
1. Desired pitch/frequency - The note that the string will be tuned to.

### Tension Formula

For non-metric, the formula is

T = (UW * (2 * L * F)<sup>2</sup>) / 386.4

Where:
- T is Tension in pounds-force
- UW is Unit Weight in lb/in
- L is Scale Length in inches
- F is Frequency in Hz (inverse seconds)
- Not explained in the pdf: 386.4 is acceleration due to gravity in in/sec<sup>2</sup>

For the more scientifically geared folks, in metric, it's:

T = (UW * (2 * L * F)<sup>2</sup>) / 9.806e6

Where:

- T is Tension in kgf
- UW is Unit Weight in kgf/10cm
- L is Scale Length in cm
- F is Frequency in Hz (inverse seconds)
- 9.806e6 is acceleration due to gravity in m/sec<sup>2</sup> times 1000000 to compensate for the conversion of cm and 10cm to standard meters.

## Analyzing the Tables

Taking some samples from the tables, we can tabulate gauge w.r.t. unit weight. For some reason, the pdfs don't list gauge, so we had to look these up or infer them from the item code. (Sometimes they're listed as xxyyy, where xx is the material and yyy is the gauge.) I did this in a Google Sheet:

![][2]

To get the regression curves, I ended up playing with a few of the trend-line regression types, but really, quadratic (x<sup>2</sup>) makes the most sense here. This is because the string can be modeled as a cylinder, cylinder volumes vary as radius squared, and mass is directly proportional to volume for constant density. The flaw with the model is that it does not account for the thickness of the core vs the windings in wound strings, but the R-squared values are all reasonably close to 1 (&gt; 0.990), so I feel the results are satisfactory.

Really, though we can do a little better (&gt; .995) if we force c to be 0. The Google Sheet Charts don't let us do that with the trendlines, though we can still get it done with the `LINEST()` formula function. Below are the results in order of descending quadratic coefficients.

### Regression formulas (Unit Weight vs Gauge) <noscript>(JS is required)</noscript>

<div id="pre-table-1"></div>

| Material Type | Quadratic Coefficient (a) | Linear Coefficient (b) | R-squared |
|:--------------|:--------------------------|:-----------------------|----------:|


### Results

- As expected, the plain steel and nylon strings have very small linear terms due to them being made of uniform material.
- Phosphor bronze and nickel plated seem to behave similarly, but phosphor bronze is slightly denser, which our model agrees with. This means that for the same gauge and pitch, nickel-plated will have lower tension than PB.
- The steel flatwound strangely fits the model the least, though we can get reasonably close with it.

Using this data, we can then create a calculator for string tensions: [Calculator][3].

[1]: https://www.daddario.com/globalassets/pdfs/accessories/tension_chart_13934.pdf
[2]: ./src/RegressionCurves.png
[3]: ./index.html
